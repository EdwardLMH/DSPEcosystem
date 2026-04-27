require 'xcodeproj'

PROJ_ROOT = File.expand_path('.')
PROJ_NAME = 'HSBCKyc'
BUNDLE_ID = 'com.hsbc.obkyc'
TEAM_ID   = ''  # leave blank for simulator builds

proj = Xcodeproj::Project.new("#{PROJ_NAME}.xcodeproj")

# Main group
main_group = proj.main_group
src_group  = main_group.new_group(PROJ_NAME, PROJ_NAME)

# Add all Swift files
swift_files = Dir.glob("#{PROJ_NAME}/**/*.swift").sort
file_refs = swift_files.map do |f|
  parts  = f.split('/')[1..]  # drop leading HSBCKyc/
  parent = parts[0..-2].reduce(src_group) do |g, part|
    g[part] || g.new_group(part, part)
  end
  parent.new_file(File.basename(f))
end

# Target
target = proj.new_application_target(PROJ_NAME, :ios, '17.0')
target.build_configurations.each do |c|
  c.build_settings['SWIFT_VERSION']              = '5.10'
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER']  = BUNDLE_ID
  c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
  c.build_settings['INFOPLIST_FILE']             = "#{PROJ_NAME}/App/Info.plist"
  c.build_settings['SWIFT_OPTIMIZATION_LEVEL']   = c.name == 'Debug' ? '-Onone' : '-O'
  c.build_settings['ENABLE_PREVIEWS']            = 'YES'
  c.build_settings['TARGETED_DEVICE_FAMILY']     = '1'  # iPhone only
end

# Add sources build phase
src_phase = target.source_build_phase
file_refs.each { |r| src_phase.add_file_reference(r) }

proj.save
puts "Generated #{PROJ_NAME}.xcodeproj with #{file_refs.count} source files"
